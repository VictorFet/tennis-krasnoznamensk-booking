import { formatSlotMoscow, toInputValueMoscow } from '@/lib/time';
import { deleteBookingAction, updateBookingAction } from '@/app/actions';

export function BookingCard({
  booking,
  editable = false,
  ownerLogin
}: {
  booking: {
    id: string;
    startAt: Date;
    endAt: Date;
  };
  editable?: boolean;
  ownerLogin?: string;
}) {
  return (
    <article className="bookingCard">
      <div className="bookingHeader">
        <strong>
          {formatSlotMoscow(booking.startAt)} – {formatSlotMoscow(booking.endAt)}
        </strong>
        {ownerLogin && <span className="muted">@{ownerLogin}</span>}
      </div>

      {editable && (
        <div className="bookingActions">
          <form action={updateBookingAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <label>
              Новое время (МСК)
              <input name="slot" type="datetime-local" defaultValue={toInputValueMoscow(booking.startAt)} required />
            </label>
            <button type="submit" className="btn">
              Изменить
            </button>
          </form>

          <form action={deleteBookingAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <button type="submit" className="btn ghost danger">
              Удалить
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
