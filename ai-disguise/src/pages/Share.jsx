import { useParams } from 'react-router-dom'

function Share() {
  const { id } = useParams()

  return (
    <div>
      <h1>Share Page</h1>
      <p>This is the Share page - View shared content</p>
      <p>Share ID: {id}</p>
      <p>TODO: Display original and disguised text here</p>
    </div>
  )
}

export default Share