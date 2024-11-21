import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Dashboard } from './pages/Dashboard';
import { TaskForm } from './pages/TaskForm';
import { TaskDetails } from './pages/TaskDetails'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks/new" element={<TaskForm />} />
        <Route path="/tasks/edit/:id" element={<TaskForm />} />
        <Route path="/tasks/:id" element={<TaskDetails />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
};

export default App;