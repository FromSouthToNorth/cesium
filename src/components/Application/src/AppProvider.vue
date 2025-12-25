<script>
export default {
  name: 'AppProvider',
  inheritAttrs: false,
  setup(props, { slots }) {
    console.log('--- APP INIT ---');
    return () => slots.default?.()
  },
}
</script>
