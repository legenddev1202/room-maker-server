// module.exports = () => {
//   const emitActionResult = (socket, args) => {
//     const { action, result, payload } = args;
//     socket.emit("action:result", {
//       action: action,
//       result: result,
//       payload: payload,
//     });
//   };

//   return {
//     emitActionResult,
//   };
// };

const emitActionResult = (socket, args) => {
  const { action, result, payload } = args;
  socket.emit("action:result", {
    action: action,
    result: result,
    payload: payload,
  });
};

export { emitActionResult };
