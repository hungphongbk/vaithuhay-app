import styles from './HorizontalItem.m-scss'

const HorizontalItem = {
  functional: true,
  render: (h, { props, children }) => {
    const cardStyles = {
      [styles.card]: true,
      [styles.current]: props.selected
    }
    return (
      <div class={cardStyles}>
        {props.img.length > 0 && (
          <div class={styles.cardImage}>
            <img src={props.img} alt="" />
          </div>
        )}
        <div class={styles.cardContent}>{children}</div>
      </div>
    )
  },
  props: {
    img: {
      type: String,
      default: ''
    },
    selected: {
      type: Boolean,
      default: false
    }
  }
}

export default HorizontalItem
