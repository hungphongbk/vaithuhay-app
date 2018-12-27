const DisplayGuard = {
  functional: true,
  render: (h, { props: { conditional, text }, children }) => {
    if (!conditional)
      return (
        <p class="text-center">
          <i>{text}</i>
        </p>
      )
    return children
  },
  props: {
    conditional: {
      type: Boolean,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  }
}

export default DisplayGuard
