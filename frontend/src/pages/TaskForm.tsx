import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

// Separate schemas for create and update
const createTaskSchema = z.object({
  title: z
    .string()
    .min(3, "Title should be at least 3 characters")
    .max(255, "Title should be at most 255 characters"),
  description: z.string().optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Due date must be a valid date",
  }),
  userEmail: z.string().email("User email must be a valid email address"),
  status: z
    .enum(["not_started", "in_progress", "completed", "cancelled", "overdue"])
    .optional(),
});

const updateTaskSchema = createTaskSchema.omit({ userEmail: true });

type CreateTaskFormData = z.infer<typeof createTaskSchema>;
type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

export const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  // Use different form types based on whether we're editing or creating
  const form = useForm<CreateTaskFormData | UpdateTaskFormData>({
    resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      ...(isEditing ? {} : { userEmail: "" }),
    },
  });

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${id}`);
      // Format the date for the input field
      const date = new Date(response.data.dueDate);
      const formattedDate = date.toISOString().slice(0, 16); // YYYY-MM-DDThh:mm

      const taskData = {
        ...response.data,
        dueDate: formattedDate,
      };

      // console.log("Fetched task data:", taskData);
      form.reset(taskData);
    } catch (error: any) {
      // console.error("Fetch error:", error.response?.data || error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch task details.",
      });
      navigate("/");
    }
  };

  useEffect(() => {
    if (isEditing) {
      fetchTask();
    }
  }, [id]);

  const onSubmit = async (data: CreateTaskFormData | UpdateTaskFormData) => {
    try {
      
      const formattedDate = new Date(data.dueDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const formattedData = {
        ...data,
        description: data.description || "",
        dueDate: formattedDate,
      };

      // console.log("Submitting data:", formattedData);

      let response;
      if (isEditing) {
        // Omit userEmail from update data
        const { userEmail, ...updateData } = formattedData;
        // console.log("Update data:", updateData);
        response = await api.put(`/tasks/${id}`, updateData);
      } else {
        response = await api.post("/tasks", formattedData);
      }

      // console.log("API Response:", response.data);

      toast({
        title: "Success",
        description: `Task ${isEditing ? "updated" : "created"} successfully.`,
      });
      navigate("/");
    } catch (error: any) {
      // console.error("Submit error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to save task. Please try again.";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={isEditing ? "Edit Task" : "Create New Task"}
        description={
          isEditing
            ? "Update your task details"
            : "Add a new task to your schedule"
        }
      />
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-8"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white/10 backdrop-blur-md rounded-lg p-8 space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter task title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter task description"
                      className="h-32"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="datetime-local"
                      onChange={(e) => {
                        // console.log("Selected date:", e.target.value);
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
};
