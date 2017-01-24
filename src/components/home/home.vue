<template >
    <section>
        <div class="animate-area">
        <add-meal></add-meal>
        </div>
    </section>
</template>
<script>
    import AddMeal from '../addmeal/addmeal'
    export default{
        data(){
            return {
            }
        },
        components:{
            AddMeal
        }
    }
</script>
<style scoped lang="scss">
    @keyframes animatedBackground {
	from { background-position: 0% 0%; }
	to { background-position: 100% 100%; }
}
 .animate-area	{ 
	background-image: url('../../assets/backgrounds/pattern.png');
	background-position: 0px 0px;
	background-repeat: repeat-x repeat-y;
    position: absolute;
    top: 53px;
    bottom: 0;
    height: 100%;
    z-index: -999;
	animation: animatedBackground 70s ease-in-out infinite;
}
 .bkg-pic{
	background-image: url('../../assets/backgrounds/4.jpg');
    background-size: 100% 100%;     
	background-repeat: repeat-x;    
	/*background-repeat: space;*/
    animation: animatedBackground 40s linear infinite;
    
 }
</style>


