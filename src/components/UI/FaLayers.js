import {
  FontAwesomeIcon,
  FontAwesomeLayers
} from '@fortawesome/vue-fontawesome'
import FaCircle from '@fortawesome/fontawesome-free-solid/faCircle'

const shapes = {
  circle: FaCircle
}

const FaLayers = {
  functional: true,
  render: (h, { props: { icon, shape, size, ...rest } }) => {
    return (
      <FontAwesomeLayers class={size ? `fa-${size}` : ''}>
        <FontAwesomeIcon
          icon={shapes[shape]}
          style={{ color: 'rgba(0,0,0,0.12)' }}
        />
        <FontAwesomeIcon icon={icon} transform="shrink-7" {...rest} />
      </FontAwesomeLayers>
    )
  },
  props: {
    icon: {
      type: Object,
      required: true
    },
    shape: {
      type: String,
      default: 'circle'
    },
    size: {
      type: String,
      default: 'lg'
    }
  }
}

export default FaLayers
