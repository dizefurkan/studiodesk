// /backoffice shows the store list directly. A redirect here raced with the layout's own
// admin-check redirect in dev and ended up as a 404 for signed-in non-admins.
export { default } from './stores/page'
