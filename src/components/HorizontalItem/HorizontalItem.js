import styles from './HorizontalItem.m-scss'

const HorizontalItem = {
  functional: true,
  render: (h, { props: { img }, children }) => {
    return (
      <div class={styles.card}>
        {img.length > 0 && (
          <div class={styles.cardImage}>
            <img src={img} alt="" />
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
    }
  }
}

export default HorizontalItem
