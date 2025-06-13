// api/check.js

module.exports = async (req, res) => {
  return res.status(200).json({
    status: "ok",
    time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
  });
};
