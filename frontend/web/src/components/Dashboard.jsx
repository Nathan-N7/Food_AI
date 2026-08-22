import {useNavigate} from 'react-router-dom'


const Dashboard = () =>{
    const navigate = useNavigate();
    return(
        <section>
            <button onClick={()=>navigate('/generate')}>Generate</button>
            <button onClick={()=>navigate('/history')}>History</button>
        </section>
    )
}
export default Dashboard;