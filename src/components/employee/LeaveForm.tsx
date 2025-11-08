import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeaveFormData {
  type: string;
  fromDate: Date;
  toDate: Date;
  reason: string;
}

interface LeaveFormProps {
  leaveBalance: { casual: number; sick: number; privilege: number };
  onSubmit: (data: LeaveFormData) => void;
  onSaveDraft?: (data: LeaveFormData) => void;
}

export function LeaveForm({ leaveBalance, onSubmit, onSaveDraft }: LeaveFormProps) {
  const form = useForm<LeaveFormData>();

  const handleSubmit = (data: LeaveFormData) => {
    const selectedType = data.type;
    const balance = selectedType === 'casual' ? leaveBalance.casual : 
                    selectedType === 'sick' ? leaveBalance.sick : 
                    leaveBalance.privilege;

    if (balance <= 0) {
      toast.error('Insufficient leave balance');
      return;
    }

    onSubmit(data);
    form.reset();
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    onSaveDraft?.(data);
    toast.success('Leave draft saved');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4">
          <h3 className="font-semibold">Leave Balance</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{leaveBalance.casual}</p>
              <p className="text-sm text-muted-foreground">Casual</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{leaveBalance.sick}</p>
              <p className="text-sm text-muted-foreground">Sick</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{leaveBalance.privilege}</p>
              <p className="text-sm text-muted-foreground">Privilege</p>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Leave Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="privilege">Privilege Leave</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>From Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>To Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide a reason for your leave..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            Submit Request
          </Button>
          {onSaveDraft && (
            <Button type="button" variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
