// src/pages/Reservations.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ReservationDetailsSheet from '@/components/custom/reservationDetails';

interface Reservation {
  id: string;
  createdAt?: string | null;           // Reservation Date
  checkInDate?: string | null;
  checkOutDate?: string | null;
  totalPrice?: number | null;          // ← FIXED: use correct field name from backend
  status: string;
  customerFullName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  roomImageUrl?: string | null;
  userUsername?: string | null;
}

const fetchReservations = async (): Promise<Reservation[]> => {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8080/api/reservations', {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) throw new Error('Failed to fetch reservations');
  return res.json();
};

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

  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
};

export default function Reservations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ['reservations'],
    queryFn: fetchReservations,
  });

  const handOverMutation = useMutation({
    mutationFn: markAsHandovered,
    onSuccess: () => {
      toast.success('Reservation marked as Handovered');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customerFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.roomName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (res: Reservation) => {
    setSelectedReservation(res);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search by ID, customer or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
           
        </div>
      </div>

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reservations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl font-medium">No reservations found</p>
              <p className="mt-2">Create a new reservation or adjust filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Reservation Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{res.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      {res.createdAt ? format(new Date(res.createdAt), 'PPP p') : '—'}
                    </TableCell>
                    <TableCell>{res.checkInDate || '—'}</TableCell>
                    <TableCell>{res.checkOutDate || '—'}</TableCell>
                    <TableCell>
                      ${(res.totalPrice ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          res.status === 'Pending' && "bg-yellow-100 text-yellow-800",
                          res.status === 'Confirmed' && "bg-blue-100 text-blue-800",
                          res.status === 'Handovered' && "bg-green-100 text-green-800",
                          res.status === 'Cancelled' && "bg-red-100 text-red-800",
                          res.status === 'Completed' && "bg-gray-100 text-gray-800"
                        )}
                      >
                        {res.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(res)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reservation Details Sheet */}
      {selectedReservation && (
        <ReservationDetailsSheet
          reservation={selectedReservation}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onHandover={() => {
            toast.success('Marked as Handovered');
            queryClient.invalidateQueries({ queryKey: ['reservations'] });
          }}
        />
      )}
    </div>
  );
}