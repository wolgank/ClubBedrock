import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { isDateRangeValid } from '../../../utils/utils';
import { toast } from 'sonner';
// Coming soon...
// import { Checkbox  } from '@/components/ui/checkbox';
// import { DateTimePicker } from '@/components/ui/datetime-picker';

type EventFilterModalProps = {
  closeModal: () => void;
  applyFilters: (filter: Filters) => void;
};

type Filters = {
  startDate?: string;
  endDate?: string;
  startHour?: string;
  endHour?: string;
  orden?: "reciente" | "antiguo";
  inscritos?: boolean;
  socios?: boolean;
  invitados?: boolean;
};

export default function EventFilterModal({ closeModal, applyFilters }: EventFilterModalProps) {
  // Estado para manejar los filtros
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    startHour: '',
    endHour: '',
    orden: 'reciente',
    inscritos: false,
    socios: false,
    invitados: false,
  });

  // Función para manejar cambios en los inputs de tipo texto o select
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Función para manejar los cambios en los checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: checked,
    }));
  };

  const handleApplyFilters = (e : React.FormEvent) => {
    e.preventDefault();

    // validación de datos
    // => Si ambas fechas están definidas
    if(filters.startDate && filters.endDate) {
      // => fechas: startDate < endDate
      if(!isDateRangeValid(filters.startDate, filters.endDate)) {
        toast.error("Escriba un rango de fechas válido o deje una fecha vacía.")
        return
      }

      // => horas: si es un mismo día, startHour <= endHour
      if(
        filters.startDate === filters.endDate
        && filters.startHour && filters.endHour
        && Number(filters.startHour) > Number(filters.endHour)
      ) {
        toast.error("Para un mismo día, la hora de inicio debe ser mayor o igual a la de fin.")
        return
      }
    }

    applyFilters(filters);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 h-full overflow-y-auto">
      <form onSubmit={handleApplyFilters} className="background-custom rounded-xl w-sm sm:w-2/3 sm:max-w-xl relative p-6">
        
        {/* Botón X */}
        <button
          className="absolute top-3 right-3 hover:text-gray-500"
          onClick={closeModal}
        >
          &times;
        </button>

        {/* Título del modal */}
        <h2 className="text-xl font-bold mb-4 text-[var(--brand)] text-center">
          Filtrar y ordenar eventos
        </h2>

        {/* Contenido del modal */}
        <div>
          <div className="space-y-4 mb-6 border-b border-[#DCDCDC] pb-4">
            <h3 className="text-lg font-semibold text-[var(--brand-light)]">
              Filtros disponibles
            </h3>
            
            {/* Fechas y horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="FechaInicio" className="block text-sm font-medium mb-1">
                  Eventos realizados desde:
                </label>
                <input
                  id="FechaInicio"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleInputChange}
                  className="block w-full border rounded px-3 py-2 border-[#cccccc]"
                />
              </div>
              <div>
                <label htmlFor="FechaFin" className="block text-sm font-medium mb-1">
                  Eventos realizados hasta:
                </label>
                <input
                  id="FechaFin"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleInputChange}
                  className="block w-full border rounded px-3 py-2 border-gray-300"
                />
              </div>
              <div>
                <label htmlFor="horaInicio" className="block text-sm font-medium mb-1">
                  Realizado desde las:
                </label>
                <select
                  id="HoraInicio"
                  name="startHour"
                  value={filters.startHour}
                  onChange={handleInputChange}
                  className="block w-full border rounded px-3 py-2 border-gray-300"
                >
                  <option value="" className='dark:text-[var(--text-dark)]'>hh:mm</option>
                  {[...Array(24).keys()].map((hour) => {
                    return <option key={hour} value={hour} className='dark:text-[var(--text-dark)]'>{`${hour.toString().padStart(2, '0')}:00`}</option>
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="HoraFin" className="!block !text-sm !font-medium mb-1">
                  Realizado hasta las:
                </label>
                <select
                  id="HoraFin"
                  name="endHour"
                  value={filters.endHour}
                  onChange={handleInputChange}
                  className="block w-full border rounded px-3 py-2 border-gray-300"
                >
                  <option value="" className='dark:text-[var(--text-dark)]'>hh:mm</option>
                  {[...Array(24).keys()].map((hour) => {
                    return <option key={hour} value={hour} className='dark:text-[var(--text-dark)]'>{`${hour.toString().padStart(2, '0')}:00`}</option>
                  })}
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 mt-4">
              <label htmlFor="SoloSocios" className="flex items-center space-x-2">
                <input
                  id="SoloSocios"
                  type="checkbox"
                  name="socios"
                  checked={filters.socios}
                  onChange={handleCheckboxChange}
                  className="size-3.5 mr-1"
                />
                <span>Eventos solo para socios</span>
              </label>
            </div>

          </div>

          {/* Ordenamiento */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-[var(--brand-light)]">
              Opciones de ordenamiento
            </h3>
            <div className="flex flex-nowrap justify-between">
              <label className="block text-sm font-medium">
                Orden de antiguedad
              </label>
              <select
                name="orden"
                value={filters.orden}
                onChange={handleInputChange}
                className="mt-1 block w-full border rounded px-3 py-2 border-gray-300"
              >
                <option value="reciente" className='dark:text-[var(--text-dark)]'>Del más reciente a más antiguo</option>
                <option value="antiguo" className='dark:text-[var(--text-dark)]'>Del más antiguo a más reciente</option>
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-center space-x-2 gap-4">
          <Button
            className="button3-custom text-[var(--text-light)] w-36"
            type="submit"
          >
            Aplicar filtros
          </Button>
          <Button
            className="button4-custom text-[var(--text-light)] w-36"
            type="button"
            onClick={closeModal}
          >
            Cancelar
          </Button>
        </div>

      </form>
    </div>
  );
}
