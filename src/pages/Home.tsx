// src/pages/Home.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AddRoomSheet from '@/components/custom/AddRooms';
import RoomReservationSheet from '@/components/custom/RoomReservation'; // ← new import
import { Textarea } from '@/components/ui/textarea';

interface Room {
  id: string;
  name?: string | null;
  description?: string | null;
  pricePerNight: number;
  capacity: number;
  imageUrl?: string;
  available: boolean;
}

type EditableField = 'name' | 'description' | 'pricePerNight' | 'capacity';
type RoomUpdate = Partial<Pick<Room, EditableField>> & { image?: File };

const fetchRooms = async (): Promise<Room[]> => {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8080/api/rooms', {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
};

const updateRoom = async ({ id, updates }: { id: string; updates: RoomUpdate }) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();

  if (updates.name !== undefined) formData.append('name', updates.name ?? '');
  if (updates.description !== undefined) formData.append('description', updates.description ?? '');
  if (updates.pricePerNight !== undefined) formData.append('pricePerNight', updates.pricePerNight.toString());
  if (updates.capacity !== undefined) formData.append('capacity', updates.capacity.toString());
  if (updates.image) formData.append('image', updates.image);

  const res = await fetch(`http://localhost:8080/api/rooms/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update room');
  }

  return res.json();
};

const deleteRoom = async (id: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:8080/api/rooms/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete room');
  }
};

export default function Home() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [reserveSheetOpen, setReserveSheetOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: fetchRooms,
  });

  const updateMutation = useMutation({
    mutationFn: updateRoom,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['rooms'] });
      const previousRooms = queryClient.getQueryData<Room[]>(['rooms']);

      queryClient.setQueryData<Room[]>(['rooms'], (old = []) =>
        old.map((room) => (room.id === id ? { ...room, ...updates } : room))
      );

      return { previousRooms };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['rooms'], context?.previousRooms);
      toast.error('Update failed');
    },
    onSuccess: () => {
      toast.success('Room updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['rooms'] });
      const previousRooms = queryClient.getQueryData<Room[]>(['rooms']);

      queryClient.setQueryData<Room[]>(['rooms'], (old = []) =>
        old.filter((room) => room.id !== id)
      );

      return { previousRooms };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['rooms'], context?.previousRooms);
      toast.error('Delete failed');
    },
    onSuccess: () => {
      toast.success('Room deleted successfully');
      setDeleteDialogOpen(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const filteredRooms = (rooms || []).filter((room) => {
    if (!room || !room.id) return false;

    const searchLower = searchTerm.toLowerCase().trim();

    const nameText = (room.name ?? 'Unnamed Room').toLowerCase();
    const descText = (room.description ?? '').toLowerCase();

    const matchesSearch = nameText.includes(searchLower) || descText.includes(searchLower);

    const matchesCapacity = capacityFilter === 'all' || room.capacity === Number(capacityFilter);

    return matchesSearch && matchesCapacity;
  });

  const startEditing = (room: Room, field: EditableField) => {
    setEditingCell({ id: room.id, field });
    setEditValue(room[field] ?? '');
  };

  const handleBlur = (room: Room) => {
    if (!editingCell || editingCell.id !== room.id) return;

    const newValue = editValue;
    const oldValue = room[editingCell.field] ?? '';

    if (String(newValue) === String(oldValue)) {
      setEditingCell(null);
      return;
    }

    const updates: Partial<Room> = {};
    if (editingCell.field === 'name' || editingCell.field === 'description') {
      updates[editingCell.field] = String(newValue);
    } else if (editingCell.field === 'pricePerNight') {
      updates.pricePerNight = Number(newValue) || 0;
    } else if (editingCell.field === 'capacity') {
      updates.capacity = Number(newValue) || 0;
    }

    updateMutation.mutate({ id: room.id, updates });
    setEditingCell(null);
  };

  const handleImageChange = (room: Room, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreviews((prev) => ({ ...prev, [room.id]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    updateMutation.mutate({
      id: room.id,
      updates: { image: file },
    });
  };

  const handleReserveClick = (room: Room) => {
    setSelectedRoom(room);
    setReserveSheetOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteDialogOpen) {
      deleteMutation.mutate(deleteDialogOpen);
    }
  };

  return (
    <div className="space-y-6 p-6 relative min-h-screen">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Rooms Overview</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Search rooms..."
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

          <Select value={capacityFilter} onValueChange={setCapacityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Capacity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="2">2 Members</SelectItem>
              <SelectItem value="4">4 Members</SelectItem>
              <SelectItem value="5">5 Members</SelectItem>
              <SelectItem value="6">6 Members</SelectItem>
              <SelectItem value="8">8 Members</SelectItem>
              <SelectItem value="10">10 Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-xl font-medium">No rooms found</p>
              <p className="mt-2">Try adjusting your search or add a new room</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Image</TableHead>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price/Night</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-gray-50">
                    {/* Image */}
                    <TableCell>
                      <label className="cursor-pointer block">
                        {imagePreviews[room.id] || room.imageUrl ? (
                          <img
                            src={imagePreviews[room.id] || room.imageUrl || 'https://via.placeholder.com/64?text=No+Image'}
                            alt={room.name || 'Room'}
                            className="h-16 w-16 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs border">
                            Click to upload
                          </div>
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(room, e)}
                        />
                      </label>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      {editingCell?.id === room.id && editingCell.field === 'name' ? (
                        <Input
                          value={editValue as string}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleBlur(room)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-text min-h-[1.5rem]"
                          onClick={() => startEditing(room, 'name')}
                        >
                          {room.name || 'Unnamed Room'}
                        </div>
                      )}
                    </TableCell>

                    {/* Description */}
                    <TableCell className="max-w-xs">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="cursor-text truncate min-h-[1.5rem]"
                              onClick={() => startEditing(room, 'description')}
                            >
                              {editingCell?.id === room.id && editingCell.field === 'description' ? (
                                <Textarea
                                  value={editValue as string}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleBlur(room)}
                                  autoFocus
                                  rows={2}
                                />
                              ) : (
                                (room.description ?? 'No description').slice(0, 80) +
                                ((room.description ?? '').length > 80 ? '...' : '')
                              )}
                            </div>
                          </TooltipTrigger>
                          {(room.description ?? '').length > 80 && (
                            <TooltipContent>
                              <p>{room.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      {editingCell?.id === room.id && editingCell.field === 'pricePerNight' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleBlur(room)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-text min-h-[1.5rem]"
                          onClick={() => startEditing(room, 'pricePerNight')}
                        >
                          ${(room.pricePerNight || 0).toFixed(2)}
                        </div>
                      )}
                    </TableCell>

                    {/* Capacity */}
                    <TableCell>
                      {editingCell?.id === room.id && editingCell.field === 'capacity' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleBlur(room)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-text min-h-[1.5rem]"
                          onClick={() => startEditing(room, 'capacity')}
                        >
                          {(room.capacity ?? 0)} Members
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-blue-600 focus:text-blue-600"
                            onClick={() => handleReserveClick(room)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Reserve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteDialogOpen(room.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialogOpen} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{filteredRooms.find(r => r.id === deleteDialogOpen)?.name || 'this room'}</strong>?  
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialogOpen) {
                  deleteMutation.mutate(deleteDialogOpen);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Add Button */}
      <AddRoomSheet />

      {/* Room Reservation Sheet - separate component */}
      {selectedRoom && (
        <RoomReservationSheet
          roomId={selectedRoom.id}
          roomName={selectedRoom.name || 'Unnamed Room'}
          pricePerNight={selectedRoom.pricePerNight}
          open={reserveSheetOpen}
          onOpenChange={(open) => {
            setReserveSheetOpen(open);
            if (!open) {
              setSelectedRoom(null);
            }
          }}
        />
      )}
    </div>
  );
}