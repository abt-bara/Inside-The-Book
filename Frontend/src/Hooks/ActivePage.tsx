import { useLocation } from 'react-router-dom'

export const useActivePage = () => {
  const location = useLocation()
  const output = location.pathname.toString()
  console.log('Active Page:', output) // Log the active page to the console
  return output
}   
export default useActivePage
