import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import ReminderDialog from "../components/ReminderDialog";
import { useReminderSettings } from "../hooks/useReminderSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Mail, Edit2, Trash2, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  status: keyof typeof statusColors;
  dueDate: string;
  userEmail: string;
}

const statusColors = {
  not_started: "bg-slate-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  overdue: "bg-red-500",
  cancelled: "bg-gray-500",
} as const;

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(false);
  
  const {
    reminderEnabled,
    isLoading: reminderLoading,
    toggleReminder,
    lastSent,
    nextReminder
  } = useReminderSettings(id);

  useEffect(() => {
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await api.get<Task>(`/tasks/${id}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch task details.",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (!task || !id) return;

    try {
      const response = await api.put<Task>(`/tasks/${id}`, {
        status: newStatus,
      });
      setTask(response.data);
      toast({
        title: "Success",
        description: `Task status updated to ${newStatus.replace("_", " ")}.`,
      });
    } catch (error: any) {
      console.error("Status update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.error || "Failed to update task status.",
      });
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await api.delete(`/tasks/${id}`);
      toast({
        title: "Success",
        description: "Task deleted successfully.",
      });
      navigate("/");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to delete task.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleReminderToggle = async () => {
    if (!task || !id) return;
    
    await toggleReminder(id, task.userEmail, task.dueDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-6 hover:bg-gray-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <ReminderDialog
              open={reminderOpen}
              onOpenChange={setReminderOpen}
              userEmail={task.userEmail}
              dueDate={task.dueDate}
              enabled={reminderEnabled}
              isLoading={reminderLoading}
              lastSent={lastSent}
              nextReminder={nextReminder}
              onToggle={handleReminderToggle}
            />

            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        statusColors[task.status]
                      }`}
                    />
                    {task.status.replace("_", " ")}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        statusColors[option.value]
                      }`}
                    />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-8">
          <div className="bg-gray-50/50 rounded-lg p-6">
            <p className="text-gray-600 leading-relaxed">{task.description}</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-100 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-gray-700 font-medium">
                {format(new Date(task.dueDate), "PPP")}
              </p>
            </div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-gray-100 flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="text-gray-700 font-medium">
                {format(new Date(task.dueDate), "p")}
              </p>
            </div>
          </div>
          <div className="bg-white/50 rounded-lg p-4 border border-gray-100 flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-gray-500">Assigned to</p>
              <p className="text-gray-700 font-medium">{task.userEmail}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-100">
          <Button
            onClick={() => navigate(`/tasks/edit/${task.id}`)}
            className="flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit Task
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  task and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
};