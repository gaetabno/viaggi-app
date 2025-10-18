'use client'
import { createClient } from '@/app/utils/supabase/client'
import { redirect } from 'next/navigation'

export default function LogoutBtn() {

async function signOut() {
    const supabase = createClient();
  const { error } = await supabase.auth.signOut()
  redirect('/login');
}
    return (
        <button onClick={signOut} className="btn">Logout</button>
    )
}