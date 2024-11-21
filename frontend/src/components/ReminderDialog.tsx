import React from "react";
import { format } from "date-fns";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  dueDate: string;
  enabled: boolean;
  onToggle: () => void;
  isToggling: boolean;
}

export default function ReminderDialog({
  open,
  onOpenChange,
  userEmail,
  dueDate,
  enabled,
  onToggle,
  isToggling,
}: ReminderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isToggling}>
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : enabled ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          {isToggling ? "Updating..." : "Reminder"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Reminder Settings</DialogTitle>
          <DialogDescription>
            Configure email reminders for this task
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email Reminders</p>
              <p className="text-sm text-gray-500">
                Receive notifications about this task
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              disabled={isToggling}
            />
          </div>
          {enabled && (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Reminder will be sent to:
                </p>
                <p className="text-sm font-medium">{userEmail}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Task due date:</p>
                <p className="text-sm font-medium">
                  {format(new Date(dueDate), "PPP 'at' p")}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                You will receive reminders based on task urgency:
                <ul className="list-disc list-inside mt-2">
                  <li>24 hours before due date</li>
                  <li>2 hours before due date (urgent tasks)</li>
                </ul>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
