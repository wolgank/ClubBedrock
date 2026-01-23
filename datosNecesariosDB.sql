INSERT IGNORE INTO Production.auth (
    id, email, username, password, role, is_active, google_id, oauth_provider
) VALUES
(1, 'admin@example.com', NULL, '$argon2id$v=19$m=65536,t=2,p=1$rXuaA41pQB1kgMURbW1sljM/S7deTCL//GYcSggFxf8$17BVaal02P/pm4X7jtZIayZuGaXC5IGAEAAHM4i294U', 'ADMIN', 1, NULL, NULL),
(2, 'evento@example.com', NULL, '$argon2id$v=19$m=65536,t=2,p=1$VruadlaBvICXZjGbrzDvT5Rhm/tDQiet9ZEkcKL7R2w$RbqhrW7BXHalQcGSAAcMdFMrqua0kOaer4y6BdQxHKc', 'EVENTS', 1, NULL, NULL),
(3, 'pam@gmail.com', 'Pam', '$argon2id$v=19$m=65536,t=2,p=1$JLUVCpXH5TQ9hCPUX7zxwqjBuVsWyhmANBQOfpIaoSE$M3cvCIICMZktoOIAzvPfg//rn9oVb+HrY3IMIZrsUpg', 'MEMBERSHIP', 1, NULL, NULL),
(4, 'deportes@example.com', 'deportes', '$argon2id$v=19$m=65536,t=2,p=1$QF5ixnPd7k0TmgoJX19FkI+xuYlNQuKiaM20YF71OxE$UROjwDuibaiEuOhBSI8jVMuikxJ4sXs7dGUK1do3W/M', 'SPORTS', 1, NULL, NULL);

INSERT IGNORE INTO Production.member_type (
    id, name, description, inclusionCost, exclusionCost, isCanPayAndRegister, costInMembershipFee
) VALUES 
    (1, 'TITULAR', 'Es quien solicita la entrada al club', 25000, 5000, 1, 500),
    (2, 'CÓNYUGUE', 'Es la esposa o el esposo del Titular', 20000, 2500, 1, 300),
    (3, 'PRIMO', 'Primo de suma confianza del titular', 15000, 1000, 1, 200),
    (4, 'HIJO', 'Retoño o descendiente biológico del titular', 10000, 500, 1, 1000),
    (5, 'SOBRINO', 'Sobrino directo del titular', 18000, 800, 1, 100);

INSERT IGNORE INTO Production.document_format (id,isForInclusion, name, description, memberTypeForDocument)
values
(1,1,"DNI u otro","Indispensable del titular.", 1),
(2,1,"Boleta de pago de servicios","Para constatar vivienda.", 1),
(3,1,"Carta de recomendación 1","Indispensable", 1),
(4,1,"Carta de recomendación 2","Indispensable", 1),
(5,1,"Fotografía personal","Conocer apariencia física del titular",1),

(6,1,"DNI u otro","Indispensable del cónyugue.", 2),
(7,1,"Acta matrimonial","Para constatar que es un matrimonio real",2),
(8,1,"Fotografía familiar","Constatar lazos reales",2),

(9,1,"DNI u otro","Indispensable.", 3),  primo
(10,1,"Fotografía familiar","Constatar lazos reales",3),
(11,1,"Acta de nacimiento","Constatar consanguineidad",3),

(12,1,"DNI u otro","Indispensable del hijo.", 4),  hijo
(13,1,"Acta de nacimiento","Para constatar que es su hijo biológico.",4),

(14,1,"DNI u otro","Indispensable.", 5),  sobrino
(15,1,"Fotografía familiar","Constatar lazos reales",5),
(16,1,"Acta de nacimiento","Constatar consanguineidad",5)
;