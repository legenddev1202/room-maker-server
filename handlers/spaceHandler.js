module.exports = () => {
  const spaceJoin = (socket, sceneID) => {
    socket.join(sceneID);
    // todo: call scene from s3
    // sceneFetch()
    // todo: cache scene and store as variable
    // sceneCache()

    emitActionResult(socket, {
      action: "space:join",
      result: "sucess",
      payload: sceneID,
    });
  };
  const spaceLeave = (socket, sceneID) => {
    socket.leave(sceneID);
    emitActionResult(socket, {
      action: "space:leave",
      result: "sucess",
      payload: sceneID,
    });
  };

  return {
    spaceJoin,
    spaceLeave,
  };
};
