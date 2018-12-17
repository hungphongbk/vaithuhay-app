const FormGroup = {
  functional: true,
  render: (h, { props, data, children }) => {
    const classNames = props.class || ''
    return (
      <div class={`form-group ${classNames}`}>
        {props.title.length > 0 && <label>{props.title}</label>}
        {children}
      </div>
    )
  },
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}

export default FormGroup
