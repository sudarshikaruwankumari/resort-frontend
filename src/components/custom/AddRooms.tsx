// src/components/AddRoomSheet.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Plus } from 'lucide-react';

const createRoom = async (formData: FormData) => {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8080/api/rooms', {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to add room');
  }

  return res.json();
};

export default function AddRoomSheet() {
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      toast.success('Room added successfully!');
      setOpen(false);
      setPreviewImage(null);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add room');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-teal-600 hover:bg-teal-700 z-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Add New Room</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Room Name *</Label>
            <Input id="name" name="name" placeholder="Deluxe Ocean View" required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Spacious room with private balcony, ocean view, air conditioning..."
              rows={4}
            />
          </div>

          {/* Price per Night */}
          <div className="space-y-2">
            <Label htmlFor="pricePerNight">Price per Night (USD) *</Label>
            <Input
              id="pricePerNight"
              name="pricePerNight"
              type="number"
              step="0.01"
              min="0"
              placeholder="150.00"
              required
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Max Capacity (Members) *</Label>
            <Select name="capacity" required>
              <SelectTrigger>
                <SelectValue placeholder="Select capacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Members</SelectItem>
                <SelectItem value="3">3 Members</SelectItem>
                <SelectItem value="4">4 Members</SelectItem>
                <SelectItem value="5">5 Members</SelectItem>
                <SelectItem value="6">6 Members</SelectItem>
                <SelectItem value="8">8 Members</SelectItem>
                <SelectItem value="10">10 Members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload + Preview */}
          <div className="space-y-3">
            <Label>Room Image</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  name="image"
                  onChange={handleImageChange}
                  className="hidden"
                  id="room-image"
                />
                <label htmlFor="room-image" className="cursor-pointer">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, max 5MB</p>
                </label>
              </div>

              {previewImage && (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="h-32 w-32 object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <SheetFooter className="sticky bottom-0 left-0 right-0 bg-white pt-4 border-t mt-6">
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Adding room...' : 'Add Room'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}