"use client";
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const CalendarView = ({ events, onDateClick, onEventClick, userRole }) => {
    return (
        <div className="calendar-container card">
            <style jsx global>{`
            .fc-event {
                cursor: pointer;
            }
            .fc-toolbar-title {
                font-size: 1.25rem !important;
                color: var(--color-navy);
            }
            .fc-button-primary {
                background-color: var(--color-sea-blue) !important;
                border-color: var(--color-sea-blue) !important;
            }
        `}</style>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                dateClick={onDateClick}
                eventClick={(info) => {
                    if (onEventClick) onEventClick(info.event);
                }}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                height="auto"
                allDaySlot={false}
            />
        </div>
    );
};

export default CalendarView;
