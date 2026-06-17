import streambyLogo from "../../../assets/streamby-logo.svg";

export const Loader = () => {
  return (
    <div className="loader d-flex">
      <img src={streambyLogo} className="logo" width={"50%"} alt="" />
    </div>
  )
}
