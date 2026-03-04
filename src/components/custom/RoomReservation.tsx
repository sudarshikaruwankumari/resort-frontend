// src/components/custom/RoomReservationSheet.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoomReservationSheetProps {
  roomId: string;
  roomName: string;
  pricePerNight: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AvailabilityCheck {
  available: boolean;
  bookedDates?: { checkIn: string; checkOut: string }[];
  message?: string;
}

interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
}

const checkAvailability = async ({
  roomId,
  checkIn,
  checkOut,
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
}): Promise<AvailabilityCheck> => {
  const token = localStorage.getItem('token');

  // Replace with your real backend endpoint
  const res = await fetch(
    `http://localhost:8080/api/reservations/check?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to check availability');
  }

  return res.json();
};

const createReservation = async ({
  roomId,
  checkIn,
  checkOut,
  customer,
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  customer: CustomerDetails;
}) => {
  const token = localStorage.getItem('token');

  const res = await fetch('http://localhost:8080/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      customerFullName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create reservation');
  }

  return res.json();
};

export default function RoomReservationSheet({
  roomId,
  roomName,
  pricePerNight,
  open,
  onOpenChange,
}: RoomReservationSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [customer, setCustomer] = useState({ fullName: '', email: '', phone: '' });
  const [billingOpen, setBillingOpen] = useState(false);

  const nights = checkIn && checkOut 
    ? Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;
  const totalPrice = nights * pricePerNight;

  const availabilityMutation = useMutation({
    mutationFn: checkAvailability,
    onSuccess: (data) => {
      if (data.available) {
        setStep(2);
        toast.success('Room available!');
      } else {
        toast.error(data.message || 'Room is already booked');
      }
    },
    onError: () => {
      toast.error('Failed to check availability');
    },
  });

  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      toast.success('Reservation created successfully!');
      onOpenChange(false);
      setStep(1);
      setCheckIn(undefined);
      setCheckOut(undefined);
      setCustomer({ fullName: '', email: '', phone: '' });
      setBillingOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create reservation');
    },
  });

  const handleCheckAvailability = () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select both dates');
      return;
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out must be after check-in');
      return;
    }

    availabilityMutation.mutate({
      roomId,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
    });
  };

  const handleConfirmReservation = () => {
    if (!customer.fullName || !customer.email || !customer.phone) {
      toast.error('Please fill all customer details');
      return;
    }

    createMutation.mutate({
      roomId,
      checkIn: format(checkIn!, 'yyyy-MM-dd'),
      checkOut: format(checkOut!, 'yyyy-MM-dd'),
      customer,
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Reserve: {roomName}</SheetTitle>
            <SheetDescription>
              {step === 1 ? 'Select your stay dates' : 'Enter guest details'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !checkIn && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !checkOut && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          initialFocus
                          disabled={(date) => checkIn ? date <= checkIn : date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleCheckAvailability}
                    disabled={!checkIn || !checkOut || availabilityMutation.isPending}
                  >
                    {availabilityMutation.isPending ? 'Checking...' : 'Check Availability'}
                  </Button>
                </div>

                {availabilityMutation.isError && (
                  <div className="text-red-600 text-center">
                    {availabilityMutation.error?.message || 'Error checking availability'}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Guest Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={customer.fullName}
                        onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={customer.phone}
                        onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                        placeholder="+94 77 123 4567"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setBillingOpen(true)}
                    disabled={!customer.fullName || !customer.email || !customer.phone}
                  >
                    Review & Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </div>

          <SheetFooter>
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Dates
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Billing Confirmation Dialog */}
      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Confirmation</DialogTitle>
            <DialogDescription>
              Please review the booking details before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Room</p>
                <p className="font-medium">{roomName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guest</p>
                <p className="font-medium">{customer.fullName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-medium">{checkIn ? format(checkIn, 'PPP') : '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-medium">{checkOut ? format(checkOut, 'PPP') : '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nights</p>
                <p className="font-medium">{nights}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="font-medium text-lg">${(totalPrice ?? 0).toFixed(2)} </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReservation}
              disabled={createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Confirming...' : 'Confirm & Reserve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}