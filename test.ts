async function test() {
  const res = await fetch("https://apis.tianapi.com/networkhot/index?key=invalid");
  const data = await res.text();
  console.log(data);
}
test();
