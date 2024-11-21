import { FC } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Mail } from "lucide-react";
import { Task } from "@/types/task";
import { Link } from "react-router-dom";

interface TaskCardProps {
  task: Task;
}

export const TaskCard: FC<TaskCardProps> = ({ task }) => {
  const statusColors = {
    not_started: "bg-gray-200 text-gray-800",
    in_progress: "bg-blue-200 text-blue-800",
    completed: "bg-green-200 text-green-800",
    cancelled: "bg-red-200 text-red-800",
    overdue: "bg-yellow-200 text-yellow-800",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/tasks/${task.id}`}>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl font-display">
                {task.title}
              </CardTitle>
              <Badge className={statusColors[task.status]}>
                {task.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <p
                className="text-muted-foreground line-clamp-3"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {task.description}
              </p>
              {/* {task.description?.length > 180 && (
                <span className="absolute bottom-0 right-0 bg-gradient-to-l from-background pl-2">
                  ...
                </span>
              )} */}
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{format(new Date(task.dueDate), "PPP")}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2" />
                <span>{format(new Date(task.dueDate), "p")}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 mr-2" />
                <span>{task.userEmail}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};
