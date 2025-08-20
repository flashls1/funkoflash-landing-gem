import { Route } from 'react-router-dom';
import BusinessEventsPage from '@/features/business-events/BusinessEventsPage';

// Business Events Routes - append-only extension
export const businessEventsRoutes = (
  <>
    <Route path="/admin/business-events" element={<BusinessEventsPage />} />
    <Route path="/business/events" element={<BusinessEventsPage />} />
  </>
);