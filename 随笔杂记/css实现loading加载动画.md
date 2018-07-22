## css实现loading加载动画

思路如下：
1、提供一个外层div，宽和高都设置为40px（正方形，方便内部旋转形成圆圈），相对定位（方便内部绝对定位）；
2、内部构建一个div，宽高100%，绝对定位，和外层div重叠，再利用:before伪元素形成圆圈；
3、重复步骤2，制作6个相同的圆圈；
4、利用transform属性旋转（rotate）内部div，每个圆圈偏离30deg（6*60 = 360）；
5、利用animation控制圆圈的透明值（opacity）
6、利用animation-delay制造延时


``` css ```
/* 1、提供一个外层div，宽和高都设置为40px（正方形，方便内部旋转形成圆圈），相对定位（方便内部绝对定位）； */
.fake-circle {
    width: 40px;
    height: 40px;
    position: relative;
}

/* 2、内部构建一个div，宽高100%，绝对定位，和外层div重叠，再利用:before伪元素形成圆圈； */
/* 3、重复步骤2，制作6个相同的圆圈； */
.fake-circle .circle {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
}
.fake-circle .circle::before {
    content: '';
    display: block;
    margin: 0 auto;
    width: 15%;
    height: 15%;
    background: #ccc;
    border-radius: 100%;
    animation: circleFadeDelay 1.2s infinite ease-in-out both;
}

/* 5、利用animation控制圆圈的透明值（opacity） */
@-webkit-keyframes circleFadeDelay {
    0%, 39%, 100% { opacity: 0; }
    40% { opacity: 1; }
}
@keyframes circleFadeDelay {
    0%, 39%, 100% { opacity: 0; }
    40% { opacity: 1; } 
}

/* 4、利用transform属性旋转（rotate）内部div，每个圆圈偏离30deg（6*60 = 360）； */
.fake-circle .circle:nth-child(1) {
    transform: rotate(60deg);
}
.fake-circle .circle:nth-child(2) {
    transform: rotate(120deg);
}
.fake-circle .circle:nth-child(3) {
    transform: rotate(180deg);
}
.fake-circle .circle:nth-child(4) {
    transform: rotate(240deg);
}
.fake-circle .circle:nth-child(5) {
    transform: rotate(300deg);
}
.fake-circle .circle:nth-child(6) {
    transform: rotate(360deg);
}

/* 6、利用animation-delay制造延时 */
.fake-circle .circle2:before {
    animation-delay: -1.0s;
}
.fake-circle .circle3:before {
    animation-delay: -0.8s;
}
.fake-circle .circle4:before {
    animation-delay: -0.6s;
}
.fake-circle .circle5:before {
    animation-delay: -0.4s;
}
.fake-circle .circle6:before {
    animation-delay: -0.2s;
}


``` html ```
<div class="fake-circle">
  <div class="circle circle1"></div>
  <div class="circle circle2"></div>
  <div class="circle circle3"></div>
  <div class="circle circle4"></div>
  <div class="circle circle5"></div>
  <div class="circle circle6"></div>
</div>