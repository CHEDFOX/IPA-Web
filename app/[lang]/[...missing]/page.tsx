import { notFound } from 'next/navigation';

// Any address that matches no page shows the not-found page in the visitor's language.
export default function Missing() {
  notFound();
}
