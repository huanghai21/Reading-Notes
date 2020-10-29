# Margin box

## margin collapsing

> The [top](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top) and [bottom](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom) margins of blocks are sometimes combined (collapsed) into a single margin whose size is the largest of the individual margins (or just one of them, if they are equal), a behavior known as **margin collapsing**. Note that the margins of [floating](https://developer.mozilla.org/en-US/docs/Web/CSS/float) and [absolutely positioned](https://developer.mozilla.org/en-US/docs/Web/CSS/position#absolute) elements never collapse. 

**块级元素**的**垂直方向**上的两个margin有的时候会发生合并成较大的一个，这种行为被称之为外边距塌陷。

浮动元素(float)和绝对定位(position: absolute;)元素肯定不会发生外边距塌陷的情况

一共有3中基本的外边距塌陷场景

* **Adjacent siblings** 相邻的兄弟元素之间
* **No content separating parent and descendants** 父级元素和(第一个/最后一个)子元素之间
* **Empty blocks** 空的块级元素，自己的margin-top margin-bottom 发生了合并

----------------

## Reference

* [Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing)

