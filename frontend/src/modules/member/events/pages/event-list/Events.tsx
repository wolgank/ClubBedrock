import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, Info, FilterX } from 'lucide-react'
import { type EventInfo } from '@/shared/types/Activities'
import EventFilterModal from './modals/EventFilterModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import EventImage from '../../utils/EventImage'
import { useUser } from '@/shared/context/UserContext'
import EventDetails from './modals/EventDetails'
import { EventPageState } from '../../utils/Events'
import useMemberType from '@/shared/hooks/UseMemberType'
import { isAllowedMember, transformDate, transformHour } from '@/shared/utils/utils'
import { toast } from 'sonner'

export default function Events() {
  const navigate = useNavigate()
  const [eventList, setEventList] = useState<EventInfo[]>([])
  const [selected, setSelected] = useState<number>(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { memberType, loadingMemberType } = useMemberType();
  const [eventToShow, setEventToShow] = useState<EventInfo | null>(null);

  // Filtros
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1);
  const [size] = useState(5)
  const [orden, setOrden] = useState<'reciente' | 'antiguo'>('reciente')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startHour, setStartHour] = useState('')
  const [endHour, setEndHour] = useState('')
  const [isActive] = useState(true)
  const [allowOutsiders, setAllowOutsiders] = useState(false)

  const { user, membership, loading: loadingUser } = useUser();

  useEffect(() => {
    const fetchEventos = async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        params.set('size', size.toString())
        params.set('orden', orden)
        params.set('isActive', isActive.toString())
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        if (startHour) params.set('startHour', startHour)
        if (endHour) params.set('endHour', endHour)
        if (allowOutsiders) params.set('allowOutsiders', allowOutsiders.toString())

        const userId = user?.id;

        if (!userId) {
          throw new Error("No se pudo obtener el ID del usuario autenticado.");
        }

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/event/filter?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || `Error ${res.status}: No se pudieron obtener los eventos`)
        }
        const data = await res.json()
        if (!Array.isArray(data.eventos)) throw new Error('El formato de respuesta no es válido  (Eventos)')
        if (!Number.isInteger(data.totalPages)) throw new Error('El formato de respuesta no es válido (Total Pages)')
        //console.log("aver los eventos", data.eventos);
        setEventList(data.eventos)
        setTotalPages(data.totalPages)
        setSelected(0)

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [page, size, orden, startDate, endDate, startHour, endHour, isActive, allowOutsiders, user?.id, membership.active])

  const applyFilters = (filters: {
    startDate?: string,
    endDate?: string,
    startHour?: string,
    endHour?: string,
    orden?: 'reciente' | 'antiguo',
    socios?: boolean,
    invitados?: boolean,
    inscritos?: boolean,
  }) => {
    if (filters.startDate) setStartDate(filters.startDate)
    if (filters.endDate) setEndDate(filters.endDate)
    if (filters.startHour) setStartHour(filters.startHour)
    if (filters.endHour) setEndHour(filters.endHour)
    if (filters.orden) setOrden(filters.orden)
    if (filters.socios !== undefined) setAllowOutsiders(filters.socios)
    setPage(1)
    setModalOpen(false)
  }

  // Para controlar la vista de paginación
  const getVisiblePages = (totalPages: number, currentPage: number): (number | '...')[] => {
    const pages: (number | '...')[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(
        1,
        '...',
        currentPage - 1,
        currentPage,
        currentPage + 1,
        '...',
        totalPages
      );
    }

    return pages;
  };


  // Para manejar el evento seleccionado
  const selectedEvent = eventList[selected] ?? null;

  const handleSeeMore = useCallback(() => {
    if (!selectedEvent) return;
    setEventToShow(selectedEvent);
  }, [selectedEvent]);

  const handleGoToInscription = useCallback(() => {
    navigate("/eventos/inscripcion", {
      state: {
        stateEvent: eventToShow
      } as EventPageState
    })
  }, [eventToShow, navigate]);

  const canInscribeAndPay = useMemo(() => {
    if (loadingMemberType || loadingUser) return false;
    return membership?.active && isAllowedMember(memberType);
  }, [loadingMemberType, loadingUser, memberType, membership?.active]);


  if (error) return <p className="p-4 text-red-500">Error: {error}</p>

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartHour('');
    setEndHour('');
    setOrden('reciente');
    setAllowOutsiders(false);
    setPage(1);
    toast.info("Filtros reiniciados");
  };


  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-6 lg:px-12 py-8">
      {/* Botón Regresar */}
      <div className="relative w-full max-w-[1343px] ">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="navigate-custom"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-normal text-base ">Regresar</span>
        </Button>
      </div>

      {/* Encabezado */}
      <div className="relative w-full max-w-[1343px] dark:text-[var(--primary)] flex justify-between items-end">
        <h1 className="font-bold text-5xl leading-[48px] ">
          Eventos
        </h1>
        <Button
          className='text-[var(--text-light)] button4-custom'
          onClick={() => navigate("/eventos/historial")}
        >
          Mis inscripciones
        </Button>
      </div>

      <Separator />

      {/* Contenido principal */}
      <div className="flex flex-wrap justify-center gap-6 lg:w-5xl xl:w-[1248px]">

        {/* Primera parte */}
        <div className="flex flex-col items-center min-w-[352px] w-[70%]  lg:w-[48%] h-full">

          {/* Imagen de evento */}
          <EventImage event={selectedEvent} loading={loading} />

          {/* Botón 'ver más' */}
          {/* {canReserve && */}
          <Button
            className="bg-[var(--bg-info)] text-[var(--text-dark)] hover:bg-[var(--bg-info)]/90 dark:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-light-alt)]/90 w-full mt-3 font-medium rounded-[10px] py-2 cursor-pointer"
            onClick={handleSeeMore}
            disabled={!selectedEvent || loadingMemberType}
          >
            <Info className='mb-0.5' /> Ver más información
          </Button>
          {/* } */}

        </div>

        {/* Segunda parte */}
        <div className="min-w-[352px] w-[70%] lg:w-[48%]">

          {/* Listado de eventos disponibles */}
          <Card className="h-96 background-custom">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[var(--brand)]">
                Eventos
              </CardTitle>
              <Separator className="my-2" />
            </CardHeader>

            <CardContent>
              <div className="h-64 overflow-y-auto pr-2">
                <ul className="space-y-2 w-full">
                  {loadingMemberType || loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className="h-16 w-full rounded-md bg-amber-50/70 dark:bg-gray-700"
                      />
                    ))
                  ) : (
                    <>
                      {!eventList || eventList.length === 0 ? <div>Sin eventos disponibles</div> :
                        eventList.map((event, i) => (
                          <li
                            key={event.id}
                            className={`w-full flex items-start p-2 rounded-md cursor-pointer transition-colors ${selected === i
                              ? 'bg-[#6c886e] text-[var(--text-light)]'
                              : 'hover:bg-amber-50/70 dark:hover:bg-gray-700'
                              }`}
                            onClick={() => setSelected(i)}
                          >
                            <span className="text-lg mr-2 shrink-0">
                              {selected === i ? '★' : '☆'}
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="truncate flex-1 min-w-0">
                                  {event.name}
                                </span>
                                {!event.allowOutsiders && (
                                  <span className="text-sm shrink-0 whitespace-nowrap">
                                    (Solo socios)
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">
                                {transformDate(event.date)} | {transformHour(event.startHour)} &gt; {transformHour(event.endHour)}
                              </p>
                            </div>
                          </li>
                        ))
                      }
                    </>
                  )
                  }
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Botonera de eventos */}
          <div className="mt-3 flex flex-wrap items-center justify-center min-[666px]:justify-between gap-1">

            {/* Filtros para eventos */}
            <div className='flex gap-2 mb-2'>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[var(--brand-light)] hover:bg-[var(--brand-light)]/90 dark:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-light-alt)]/90 gap-2 cursor-pointer"
                disabled={!selectedEvent}
              >
                <Filter className="w-4 h-4" /> Filtrar/Ordenar
              </Button>
              <Button
                className="bg-[var(--bg-dark)] hover:bg-[var(--bg-dark)]/90 dark:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-light-alt)]/90"
                onClick={handleClearFilters}
                disabled={!selectedEvent}
              >
                <FilterX className="w-4 h-4"/> Quitar filtros
              </Button>
            </div>

            {modalOpen && (
              <EventFilterModal
                closeModal={() => setModalOpen(false)}
                applyFilters={applyFilters}
              />
            )}

            {/* Paginación */}
            <div className="flex items-center space-x-1">
              {getVisiblePages(totalPages, page).map((item, i) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }

                return (
                  <Button
                    key={item}
                    size="sm"
                    variant={item === page ? 'default' : 'outline'}
                    onClick={() => setPage(item)}
                    className={
                      item === page
                        ? 'bg-[var(--bg-dark)] hover:bg-[var(--bg-dark)]/90 dark:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-light-alt)]/90'
                        : ''
                    }
                  >
                    {item}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del evento */}
      {eventToShow &&
        <EventDetails
          event={eventToShow}
          canInscribeAndPay={canInscribeAndPay}
          onClose={() => setEventToShow(null)}
          onGoToInscription={handleGoToInscription}
        />
      }
    </div>
  )
}

