
/*
Procedimiento y evento diario para procesar anulaciones y suspensiones, tanto aplicarlas como levantarlas (solo las suspensiones)
*/
DELIMITER $$
DROP PROCEDURE IF EXISTS process_membership_changes;
CREATE PROCEDURE process_membership_changes(IN ref_date DATE)
BEGIN
  DECLARE done_start, done_end INT DEFAULT FALSE;
  DECLARE cr_id        BIGINT;
  DECLARE cr_mem       BIGINT;
  DECLARE cr_type      ENUM('SUSPENSION','DISAFFILIATION');
  DECLARE cr_start     DATE;
  DECLARE cr_end       DATE;

  -- Cursor para solicitudes cuyo START = ref_date
  DECLARE cur_start CURSOR FOR
    SELECT id, id_membership, type, changeStartDate, changeEndDate
      FROM membership_change_request
     WHERE requestState = 'APPROVED'
       AND changeStartDate = ref_date;

  -- Cursor para suspensiones cuyo END ≤ ref_date
  DECLARE cur_end CURSOR FOR
    SELECT id, id_membership, type, changeStartDate, changeEndDate
      FROM membership_change_request
     WHERE requestState = 'APPROVED'
       AND type = 'SUSPENSION'
       AND changeEndDate <= ref_date;

  -- Handlers
  DECLARE CONTINUE HANDLER FOR NOT FOUND 
  BEGIN
    SET done_start = TRUE;
    SET done_end   = TRUE;
  END;

  -- 1) Procesar inicios de cambio
  OPEN cur_start;
  read_start: LOOP
    FETCH cur_start INTO cr_id, cr_mem, cr_type, cr_start, cr_end;
    IF done_start THEN LEAVE read_start; END IF;
-- Poner la membresía ENDED
    UPDATE membership
       SET state = 'ENDED'
     WHERE id = cr_mem;
  -- Cerrar todos los enlaces activos
    UPDATE membership_x_member
       SET end_date     = cr_start,
           reason_to_end = cr_type
     WHERE membership_id = cr_mem
       AND end_date IS NULL;
  END LOOP;
  CLOSE cur_start;

  -- 2) Procesar reactivaciones
  SET done_end = FALSE;
  OPEN cur_end;
  read_end: LOOP
    FETCH cur_end INTO cr_id, cr_mem, cr_type, cr_start, cr_end;
    IF done_end THEN LEAVE read_end; END IF;
 -- Reactivar la membresía
    UPDATE membership
       SET state = 'ACTIVE'
     WHERE id = cr_mem;
 -- Reinsertar enlaces para los miembros suspendidos
    INSERT INTO membership_x_member (
      member_id, membership_id, start_date, end_date, reason_to_end
    )
    SELECT
      member_id,
      membership_id,
      cr_end  AS start_date,
      NULL    AS end_date,
      NULL    AS reason_to_end
    FROM membership_x_member
    WHERE membership_id = cr_mem
      AND end_date = cr_start
      AND reason_to_end = 'SUSPENSION';
  END LOOP;
  CLOSE cur_end;
END$$
DELIMITER ;

DROP EVENT IF EXISTS daily_process_membership_changes;
CREATE EVENT daily_process_membership_changes
  ON SCHEDULE EVERY 1 DAY
  STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
  CALL process_membership_changes(CURRENT_DATE());

/*
Procedimiento almacenado para recalcular el finalAmount de una Bill en una fecha, lo utilizaremos en otros eventos.
*/
DELIMITER $$

-- 1) Stored procedure para recalcular montos de facturas por fecha
DROP PROCEDURE IF EXISTS recalculate_all_bills_for_date;
CREATE PROCEDURE  recalculate_all_bills_for_date(IN p_date DATE)
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE b_id INT;
  DECLARE cur CURSOR FOR
    SELECT id
    FROM bill;
    -- WHERE DATE(created_at) = p_date; -- para que no moleste!!!
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO b_id;
    IF done THEN
      LEAVE read_loop;
    END IF;
    -- Recalcular sumando todos los finalPrice de bill_detail
    UPDATE bill AS b
    JOIN (
      SELECT bill_id, COALESCE(SUM(final_price), 0) AS new_total
      FROM bill_detail
      WHERE bill_id = b_id
      GROUP BY bill_id
    ) AS agg ON agg.bill_id = b.id
    SET b.final_amount = agg.new_total
    WHERE b.id = b_id;
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

/*
  Procedimiento y evento para calcular cuotas de membresía, crear las Bill desde 5 días antes. 
  Asumimos que se cargan todos los 01 del mes como tal
*/
DELIMITER $$
DROP PROCEDURE IF EXISTS generate_monthly_membership_fees_proc;
CREATE PROCEDURE generate_monthly_membership_fees_proc(IN ref_date DATE)
BEGIN
  DECLARE next_first DATE;
  SET next_first = DATE_ADD(LAST_DAY(ref_date), INTERVAL 1 DAY);
  IF DATEDIFF(next_first, ref_date) = 5 THEN
    -- 1) Insertar facturas
    INSERT INTO bill (final_amount, status, description, created_at, due_date, user_id)
    SELECT
      0.00,
      'PENDING',
      CONCAT('CUOTA MENSUAL ', m.code, ' (GENERADO AUTOMÁTICAMENTE)'),
      ref_date, -- mejor que now aunque sería lo mismo, esto facilita testeo
      next_first,
      u.id
    FROM membership AS m
    JOIN membership_x_member AS mx 
      ON mx.membership_id = m.id 
      AND mx.end_date IS NULL

    JOIN member AS mem_tit 
      ON mem_tit.id = mx.member_id
	JOIN member_type AS mt_tit 
      ON mt_tit.id = mem_tit.member_type_id 
      AND mt_tit.name LIKE '%TITULAR%'
    JOIN `user` AS u 
      ON u.id = mem_tit.id
    WHERE m.state = 'ACTIVE';

    -- 2) Detalles
    INSERT INTO bill_detail (bill_id, price, discount, final_price, description)
    SELECT
      b.id,
      mt.costInMembershipFee,
      0.00,
      mt.costInMembershipFee,
      CONCAT(
        'CUOTA ', mt.name,
        ' (', mu.name, ' ', mu.lastname, ')' ,' (GENERADO AUTOMÁTICAMENTE)'
      )
    FROM bill AS b
    JOIN membership AS m 
      ON m.code = SUBSTRING_INDEX(SUBSTRING_INDEX(b.description, ' (', 1),' ',-1)
    JOIN membership_x_member AS mx 
      ON mx.membership_id = m.id 
      AND mx.end_date IS NULL
    JOIN member AS mem 
      ON mem.id = mx.member_id
    JOIN user AS mu 
      ON mu.id = mem.id
    JOIN member_type AS mt 
      ON mt.id = mem.member_type_id
    WHERE 
      b.status = 'PENDING'
      AND DATE(b.created_at) = ref_date
      AND b.description like '%GENERADO AUTOMÁTICAMENTE%'
      ;

    -- 3) Tickets
    INSERT INTO membership_fee_ticket (id, membership_id, start_date, end_date, moratorium_applied)
    SELECT
      bd.id,
      m.id,
      next_first,
      DATE_ADD(next_first, INTERVAL 1 MONTH),
      FALSE
    FROM bill_detail AS bd
    JOIN bill AS b ON b.id = bd.bill_id 
    JOIN membership AS m 
      ON m.code = SUBSTRING_INDEX(SUBSTRING_INDEX(b.description, ' (', 1),' ',-1)
    WHERE 
      b.status = 'PENDING'
      AND DATE(b.created_at) = ref_date
	  AND bd.description like '%GENERADO AUTOMÁTICAMENTE%'
      AND b.description like '%GENERADO AUTOMÁTICAMENTE%'
      ;

    -- 4) Recalcular totales
    CALL recalculate_all_bills_for_date(ref_date);
  END IF;
END$$
DELIMITER ;
DROP EVENT IF EXISTS `generate_monthly_membership_fees`;
CREATE EVENT IF NOT EXISTS `generate_monthly_membership_fees`
ON SCHEDULE EVERY 1 DAY
COMMENT 'Genera facturas y detalles 5 días antes del próximo mes'
DO
  CALL generate_monthly_membership_fees_proc(CURDATE());


/*
EVENTO MySQL que, cada día, busca todas las MembershipFeeTicket cuyo vencimiento (endDate) haya quedado atrás más de los días permitidos 
(paymentDeadlineDays en club), les marca la mora y genera un detalle de factura adicional. Finalmente pone la factura en estado OVERDUE y recalcula su total.
*/
DELIMITER $$
DROP PROCEDURE IF EXISTS apply_membership_fee_moratorium_proc;
CREATE PROCEDURE apply_membership_fee_moratorium_proc(IN ref_date DATE)
BEGIN
DECLARE v_deadline INT;
  DECLARE v_rate     DECIMAL(10,2);
  -- 1) Leer configuración del Club (asumimos sólo una fila)
  SELECT payment_deadline_days, moratorium_rate
    INTO v_deadline, v_rate
  FROM club
  LIMIT 1;
	
  -- 2) Marcar tickets y facturas vencidas (sólo si factura PENDING u OVERDUE)
  UPDATE membership_fee_ticket AS t
  JOIN bill_detail           AS bd ON bd.id = t.id
  JOIN bill                  AS b  ON b.id  = bd.bill_id
  SET
    t.moratorium_applied = TRUE,
    b.status             = 'OVERDUE'
  WHERE 
    t.moratorium_applied = FALSE
    AND DATEDIFF(ref_date, t.end_date) > v_deadline
    AND b.status IN ('PENDING', 'OVERDUE');

  -- 3) Generar un nuevo detalle de mora por cada ticket marcado
  INSERT INTO bill_detail (bill_id, price, discount, final_price, description)
  SELECT DISTINCT
    bd.bill_id,
    ROUND(mt.costInMembershipFee * (v_rate/100), 2) AS price,
    0.00                                        AS discount,
    ROUND(mt.costInMembershipFee * (v_rate/100), 2) AS final_price,
    CONCAT('MORA DE ', u.name, ' ', u.lastname)  AS description
  FROM membership_fee_ticket AS t
  JOIN bill_detail           AS bd ON bd.id = t.id
  JOIN bill                  AS b  ON b.id  = bd.bill_id
  JOIN membership_x_member   AS mxm 
    ON mxm.membership_id = t.membership_id
       AND mxm.start_date <= t.start_date
       AND (mxm.end_date IS NULL OR mxm.end_date >= t.end_date)
  JOIN member                AS m  ON m.id = mxm.member_id
  JOIN `user`                AS u  ON u.id = m.id
  JOIN member_type           AS mt ON mt.id = m.member_type_id
  WHERE 
    t.moratorium_applied = TRUE
    AND DATEDIFF(ref_date, t.end_date) > v_deadline
     AND b.status IN ('PENDING', 'OVERDUE');
  -- 4) Recalcular montos de todas las facturas que acabamos de poner OVERDUE
  CALL recalculate_all_bills_for_date(ref_date);
END$$
DELIMITER ;
DROP EVENT IF EXISTS apply_membership_fee_moratorium;

DELIMITER $$
CREATE EVENT apply_membership_fee_moratorium
  ON SCHEDULE EVERY 1 DAY
  COMMENT 'Aplica mora a cuotas vencidas y agrega detalle'
DO
  CALL apply_membership_fee_moratorium_proc(CURDATE());
$$
DELIMITER ;