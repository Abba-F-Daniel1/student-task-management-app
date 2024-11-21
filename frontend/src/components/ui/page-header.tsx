import { FC } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <h1 className="text-4xl font-bold font-display tracking-tight">{title}</h1>
    {description && (
      <p className="mt-2 text-lg text-muted-foreground">{description}</p>
    )}
  </motion.div>
);