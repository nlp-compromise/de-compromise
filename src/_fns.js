module.exports={
  "preProcess": "\"function (ts) {\\n    return ts;\\n  }\"",
  "postProcess": "\"function (ts) {\\n    // console.log('running postProcess')\\n    return ts;\\n  }\""
}