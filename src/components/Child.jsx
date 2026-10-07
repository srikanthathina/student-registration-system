import './Child.css'

const Child = (prop) => {
  return (
    <div className='Card'>
      <img src={prop.pizza} alt="no-image" />
      <h3>{prop.title}</h3>
      <p>{prop.price}</p>
      <button>Order Now</button>
    </div>
  )
}

export default Child
