import { motion } from 'motion/react';

const LoadingOverlay = () => (
  <motion.div
    className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="relative flex items-center justify-center mb-6">
      <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
      <div className="absolute w-16 h-16 rounded-full animate-pulse-ring border-2 border-primary/30" />
    </div>
    <h2 className="text-xl font-bold text-primary">Processing AI Analysis...</h2>
    <p className="text-sm text-muted-foreground mt-2">Syncing wearable data and running predictive models</p>
  </motion.div>
);

export default LoadingOverlay;
