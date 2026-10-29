import { ReactNode, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { FormModal } from './FormModal';

export interface FormRoute {
  path: string;
  element: ReactNode;
}

// The forms, each as a modal at its route, over the screen it was opened from (the app's routes
// show that one). Loading one's code shows nothing: the screen under it stays.
export function FormModalRoutes({ forms }: { forms: FormRoute[] }) {
  return (
    <Suspense fallback={null}>
      <Routes>
        {forms.map(form => (
          <Route key={form.path} path={form.path} element={<FormModal>{form.element}</FormModal>} />
        ))}
        <Route path="*" element={null} />
      </Routes>
    </Suspense>
  );
}
