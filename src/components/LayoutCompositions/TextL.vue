<script lang="ts">
  /**
   * A Text component  component
   * @name 'TextL'
   * @version 1.0.0
   */

  import { h } from 'vue';
  import Styles from '@/assets/styles/compositions/TextL.module.styl';

  export default defineComponent({
    props: {
      tag: {
        type: String,
        default: 'span',
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          props.tag,
          {
            class: Object.values(Styles),
          },
          slots,
        );
    },
  });
</script>
