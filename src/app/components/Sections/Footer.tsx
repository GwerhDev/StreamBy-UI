import s from './Footer.module.css';

export const Footer = () => {
  return (
    <section className={s.container}>
      <div className={s.innerContainer}>
        <ul>
          <h2>Features</h2>
          <li>
            <p>Upload your files</p>
          </li>
          <li>
            <p>Manage your files</p>
          </li>
          <li>
            <p>Get URL of your files</p>
          </li>
          <li>
            <p>Streaming</p>
          </li>
        </ul>
        <ul>
          <h2>Community</h2>
          <li>
            <p>Contact</p>
          </li>
          <li>
            <p>Support</p>
          </li>
          <li>
            <p>Developers</p>
          </li>
        </ul>
        <ul>
          <h2>Language</h2>

        </ul>
      </div>
      <img src="streamby-logo.svg" alt="" width={"200"} />
    </section>
  )
}
