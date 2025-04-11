import { Navigator } from "../components/Navigator/Navigator";
import { UnderConstruction } from "../components/Utils/UnderConstruction";

export default function DocumentationPage() {
  return (
    <div className='dashboard-container justify-content-center align-items-center flex-dir-col'>
      <Navigator />
      <UnderConstruction />
    </div>
  )
}
