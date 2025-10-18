import { login, signup } from './actions'

export default function LoginPage() {
  return (

    <form className='card w-max shadow-lg rounded-md bg-secondary/70  p-4 grid gap-2 place-content-center' > 
      <input placeholder='Email...' className='input w-full' id="email" name="email" type="email" required />
      <input placeholder='Password...' className='input w-full' id="password" name="password" type="password" required />
      <div className='grid gap-0.2 w-full'>
      <button className='btn btn-primary rounded-md w-full' formAction={login}>Log in</button> 
      <span className='text-center text-white'>or</span>
      <button className='btn btn-primary rounded-md w-full' formAction={signup}>Sign up</button> 
      </div>
    </form>
  )
}