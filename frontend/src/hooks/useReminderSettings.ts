import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

interface ReminderStatus {
  enabled: boolean;
  lastSent: string | null;
  nextReminder: string | null;
}

export const useReminderSettings = (taskId: string | undefined) => {
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>({
    enabled: false,
    lastSent: null,
    nextReminder: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchReminderStatus = useCallback(async () => {
    if (!taskId) return;

    try {
      setIsLoading(true);
      const response = await api.get(`/tasks/${taskId}/reminder`);
      setReminderStatus(response.data);
    } catch (error: any) {
      console.error("Failed to fetch reminder status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch reminder status",
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    if (taskId) {
      fetchReminderStatus();
    }
  }, [taskId, fetchReminderStatus]);

  const toggleReminder = useCallback(
    async (taskId: string, userEmail: string, dueDate: string) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        if (reminderStatus.enabled) {
          await api.delete(`/tasks/${taskId}/reminder`);
          setReminderStatus((prev) => ({ ...prev, enabled: false }));
          toast({
            title: "Reminder Disabled",
            description: "Email reminders have been disabled for this task.",
          });
        } else {
          await api.post(`/tasks/${taskId}/reminder`, {
            userEmail,
            dueDate,
          });
          setReminderStatus((prev) => ({ ...prev, enabled: true }));
          toast({
            title: "Reminder Enabled",
            description: "You will receive email reminders for this task.",
          });
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to update reminder settings.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [reminderStatus.enabled, isLoading, toast]
  );

  return {
    reminderEnabled: reminderStatus.enabled,
    isLoading,
    toggleReminder,
    lastSent: reminderStatus.lastSent,
    nextReminder: reminderStatus.nextReminder,
  };
};
