const cameralist = document.getElementById("cameralist");
if (!cameralist) console.error("cameralist does not exist");

function createCard (name: string, uid: string) {
  if (!cameralist) return;
  let base = document.createElement("div");
  base.classList.add("cameracard", "available");
  base.setAttribute("uid", uid);

  let left = document.createElement("div");
  left.classList.add("camcardleft");

  let right = document.createElement("div");
  right.classList.add("camcardright")

  let nameplate = document.createElement("span");
  nameplate.classList.add("nameplate");
  nameplate.innerText = name;

  let idtext = document.createElement("span");
  idtext.classList.add("idtext");
  idtext.innerText = uid;

  right.appendChild(nameplate);
  right.appendChild(idtext);
  
  base.appendChild(left);
  base.appendChild(right);
  cameralist.appendChild(base);
}

createCard("camera model or something", "CSX 8888");