// src/components/custom/reservationDetails.tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  createdAt?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  totalPrice?: number | null;     // ← correct field name
  status: string;
  customerFullName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  roomImageUrl?: string | null;
  userUsername?: string | null;
}

interface ReservationDetailsSheetProps {
  reservation: Reservation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHandover?: () => void;
}

const markAsHandovered = async (id: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:8080/api/reservations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ status: 'Handovered' }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update status');
  }

  return res.json();
};

export default function ReservationDetailsSheet({
  reservation,
  open,
  onOpenChange,
  onHandover,
}: ReservationDetailsSheetProps) {
  const queryClient = useQueryClient();

  const handOverMutation = useMutation({
    mutationFn: markAsHandovered,
    onSuccess: () => {
      toast.success('Room marked as Handovered');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      onOpenChange(false);
      if (onHandover) onHandover();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to mark as Handovered');
    },
  });

  if (!reservation || !reservation.id) {
    return null;
  }

  const isHandovered = reservation.status === 'Handovered';

  // Safe total amount – use correct field name
  const safeTotal = typeof reservation.totalPrice === 'number' 
    ? reservation.totalPrice 
    : 0;

  console.log('Safe Total Amount:', safeTotal); // Debug log

  const handleHandover = () => {
    handOverMutation.mutate(reservation.id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Reservation Details</SheetTitle>
          <SheetDescription>
            Reservation ID: {reservation.id}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
          {/* Staff who created */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-medium">{reservation.userUsername || 'Unknown'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Section */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{reservation.customerFullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{reservation.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{reservation.customerPhone || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Info */}
          <Card>
            <CardHeader>
              <CardTitle>Reservation Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Reservation Date</p>
                <p className="font-medium">
                  {reservation.createdAt ? format(new Date(reservation.createdAt), 'PPP p') : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room ID</p>
                <p className="font-medium">{reservation.roomId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Room Name</p>
                <p className="font-medium">{reservation.roomName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Image</p>
                {reservation.roomImageUrl ? (
                  <img
                    src={reservation.roomImageUrl}
                    alt="Room"
                    className="h-20 w-20 object-cover rounded-md border mt-1"
                  />
                ) : (
                  <p className="text-gray-500">No image</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{reservation.checkInDate || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{reservation.checkOutDate || '—'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Final Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-bold">
                  ${safeTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                {isHandovered ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Handovered
                  </Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <SheetFooter>
          {!isHandovered && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleHandover}
              disabled={handOverMutation.isPending}
            >
              {handOverMutation.isPending ? 'Updating...' : 'Mark as Handovered'}
            </Button>
          )}

          {isHandovered && (
            <div className="w-full text-center text-green-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              This reservation is already Handovered
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}