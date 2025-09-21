import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useState } from 'react';

// The old CSS imports have been removed from here

const Calendar = () => {
    const [events] = useState([
        { title: 'Haircut with Sarah', start: new Date() },
        { 
          title: 'Team Meeting', 
          start: new Date().toISOString().slice(0, 10) + 'T10:30:00', // Example for today
          end: new Date().toISOString().slice(0, 10) + 'T12:30:00' 
        },
        // In a real app, you would fetch these from your backend
    ]);

    const handleDateClick = (arg: any) => {
        alert('You clicked on: ' + arg.dateStr);
        // This is where you would open a modal to create a new appointment
    };

    const handleEventClick = (arg: any) => {
        alert('You clicked on the event: ' + arg.event.title);
        // This is where you would open a modal to show/edit event details
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                editable={true}
                selectable={true}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="85vh"
            />
        </div>
    );
};

export default Calendar;