import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '@/utils/token'
export default function AuthCallbackPage(): JSX.Element { const navigate=useNavigate(); const [params]=useSearchParams(); useEffect(()=>{const token=params.get('token'); if(token){setToken(token); navigate('/dashboard',{replace:true})} else navigate('/login',{replace:true})},[navigate,params]); return <p className="p-10">Conectando con Code Quest...</p> }
