import { redirect } from 'next/navigation';

/** `/book/admin` index: send the owner to the agenda, the default section. */
export default function AdminIndexPage() {
  redirect('/admin/agenda');
}
