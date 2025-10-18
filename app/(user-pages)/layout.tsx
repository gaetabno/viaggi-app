import { redirect } from 'next/navigation'
import { createClient } from '@/app/utils/supabase/server'
import Header from '../_components/Header';

export default async function UserPageLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }
  return (
    <div className="p-2 w-full">

        <Header />
        {children}
    </div> 
  )
}