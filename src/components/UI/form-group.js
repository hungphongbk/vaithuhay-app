const FormGroup = {
  functional: true,
  render: (h, { props, data, children }) => {
    const classNames = props.class || ''
    if (props.columns.length > 0) {
      const columns = props.columns.split(',')
      return (
        <div class={`form-group row ${classNames}`}>
          {props.title.length > 0 ? (
            <label class={`col-${columns[0]} col-form-label`}>
              {props.title}
            </label>
          ) : (
            <div class={`col-${columns[0]}`} />
          )}
          <div class={`col-${columns[1]}`}>{children}</div>
        </div>
      )
    }
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
    },
    columns: {
      type: String,
      default: ''
    }
  }
}

export default FormGroup
